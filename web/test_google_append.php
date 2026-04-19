<?php

require_once __DIR__ . '/../vendor/autoload.php';

$credentialsPath = realpath(__DIR__ . '/../private/google-service-account.json');
$spreadsheetId = '1jU8GAVZAzNNWqFjrx5JbcHIHtO1e9OTkBqC7gTkV7_Y';
$range = 'registros_inbox!A:C';

putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $credentialsPath);

$client = new Google\Client();
$client->useApplicationDefaultCredentials();
$client->setScopes([Google\Service\Sheets::SPREADSHEETS]);

try {
    $service = new Google\Service\Sheets($client);

    $values = [
        [
            'TEST-PHP-APPEND',
            date('d/m/Y'),
            date('Y-m-d')
        ]
    ];

    $body = new Google\Service\Sheets\ValueRange([
        'values' => $values
    ]);

    $params = [
        'valueInputOption' => 'USER_ENTERED',
        'insertDataOption' => 'INSERT_ROWS'
    ];

    $response = $service->spreadsheets_values->append(
        $spreadsheetId,
        $range,
        $body,
        $params
    );

    if (PHP_SAPI !== 'cli') {
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'ok' => true,
        'updatedRange' => $response->getUpdates()->getUpdatedRange(),
        'updatedRows' => $response->getUpdates()->getUpdatedRows(),
        'updatedColumns' => $response->getUpdates()->getUpdatedColumns(),
        'updatedCells' => $response->getUpdates()->getUpdatedCells()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'ok' => false,
        'message' => 'Error escribiendo en Google Sheets',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}