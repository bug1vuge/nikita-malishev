<?php
/**
 * Отправка заявки в Telegram для обычного PHP-хостинга (Beget, Timeweb, REG.RU…).
 * В .env фронтенда укажите VITE_LEAD_ENDPOINT=/lead.php
 *
 * Токен и chat_id НЕ храните в этом файле: положите рядом с папкой сайта
 * (на уровень выше public_html) файл lead-config.php:
 *
 *   <?php return ['token' => '123:ABC', 'chat_id' => '123456789'];
 *
 * или задайте переменные окружения TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'Метод не поддерживается']);
}

$config = [];
$configFile = dirname(__DIR__) . '/lead-config.php';
if (is_file($configFile)) {
    $config = include $configFile;
}
$token = $config['token'] ?? getenv('TELEGRAM_BOT_TOKEN');
$chatId = $config['chat_id'] ?? getenv('TELEGRAM_CHAT_ID');
if (!$token || !$chatId) {
    error_log('[lead] Telegram token/chat_id не заданы');
    reply(500, ['ok' => false, 'error' => 'Сервер не настроен']);
}

// Антиспам: не чаще 5 заявок с IP за 10 минут
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/lead_' . md5($ip);
$now = time();
$hits = is_file($rateFile) ? array_filter(explode(',', (string) file_get_contents($rateFile)), fn($t) => $now - (int) $t < 600) : [];
$hits[] = $now;
@file_put_contents($rateFile, implode(',', $hits));
if (count($hits) > 5) {
    reply(429, ['ok' => false, 'error' => 'Слишком много заявок']);
}

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) {
    reply(400, ['ok' => false, 'error' => 'Некорректные данные']);
}

$s = fn(string $k, int $max = 2000) => mb_substr(trim((string) ($in[$k] ?? '')), 0, $max);
$d = [
    'name' => $s('name', 200),
    'phone' => $s('phone', 40),
    'eventType' => $s('eventType', 60),
    'date' => $s('date', 20),
    'guests' => $s('guests', 10),
    'place' => $s('place', 300),
    'contactVia' => $s('contactVia', 20) ?: 'Звонок',
    'comment' => $s('comment', 3000),
    'consent' => ($in['consent'] ?? false) === true,
    'website' => $s('website', 200),
];

if ($d['website'] !== '') {
    reply(200, ['ok' => true]); // ловушка для ботов
}

$errors = [];
$len = mb_strlen($d['name']);
if ($len < 2 || $len > 60) $errors['name'] = 'Напишите, как к вам обращаться';
$digits = preg_replace('/\D/', '', $d['phone']);
if (strlen($digits) < 11 || strlen($digits) > 15) $errors['phone'] = 'Проверьте номер телефона';
if ($d['eventType'] === '') $errors['eventType'] = 'Выберите формат праздника';
if ($d['date'] !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d['date'])) $errors['date'] = 'Некорректная дата';
if ($d['guests'] !== '' && (!ctype_digit($d['guests']) || (int) $d['guests'] < 1 || (int) $d['guests'] > 5000)) $errors['guests'] = 'Укажите число гостей от 1 до 5000';
if (!in_array($d['contactVia'], ['Звонок', 'WhatsApp', 'Telegram'], true)) $errors['contactVia'] = 'Выберите способ связи';
if (!$d['consent']) $errors['consent'] = 'Нужно согласие на обработку данных';
if ($errors) {
    reply(422, ['ok' => false, 'error' => 'Проверьте поля, отмеченные красным.', 'fields' => $errors]);
}

$e = fn(string $v) => htmlspecialchars($v, ENT_NOQUOTES, 'UTF-8');
$lines = [
    '🎉 <b>Новая заявка с сайта</b>',
    '',
    '👤 <b>Имя:</b> ' . $e($d['name']),
    '📞 <b>Телефон:</b> ' . $e($d['phone']),
    '💬 <b>Связаться:</b> ' . $e($d['contactVia']),
    '🎊 <b>Формат:</b> ' . $e($d['eventType']),
];
if ($d['date'] !== '') $lines[] = '📅 <b>Дата:</b> ' . $e(implode('.', array_reverse(explode('-', $d['date']))));
if ($d['guests'] !== '') $lines[] = '👥 <b>Гостей:</b> ' . $e($d['guests']);
if ($d['place'] !== '') $lines[] = '📍 <b>Место:</b> ' . $e($d['place']);
if ($d['comment'] !== '') { $lines[] = ''; $lines[] = '📝 ' . $e($d['comment']); }

$ch = curl_init("https://api.telegram.org/bot{$token}/sendMessage");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'chat_id' => $chatId,
        'text' => implode("\n", $lines),
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE),
]);
$resp = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

$tg = json_decode((string) $resp, true);
if ($resp === false || $status !== 200 || empty($tg['ok'])) {
    error_log('[lead] Telegram error: ' . ($curlErr ?: ($tg['description'] ?? $status)));
    reply(502, ['ok' => false, 'error' => 'Не удалось доставить заявку']);
}

reply(200, ['ok' => true]);
