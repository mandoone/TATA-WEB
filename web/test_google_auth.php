<?php

require_once __DIR__ . '/../vendor/autoload.php';

$credentialsPath = realpath(__DIR__ . '/../private/google-service-account.json');
$spreadsheetId = '1jU8GAVZAzNNWqFjrx5JbcHIHtO1e9OTkBqC7gTkV7_Y';
$range = 'registros_inbox!A1:Z5';

putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $credentialsPath);

$client = new Google\Client();
$client->useApplicationDefaultCredentials();
$client->setScopes([Google\Service\Sheets::SPREADSHEETS]);

try {
    $service = new Google\Service\Sheets($client);
    $response = $service->spreadsheets_values->get($spreadsheetId, $range);

    if (PHP_SAPI !== 'cli') {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'ok' => true,
        'range' => $response->getRange(),
        'values' => $response->getValues()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'ok' => false,
        'message' => 'Error leyendo Google Sheets',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}




