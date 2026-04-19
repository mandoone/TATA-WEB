<?php

require_once __DIR__ . '/../vendor/autoload.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Metodo no permitido"
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$inputData = file_get_contents("php://input");

if (!$inputData || trim($inputData) === '') {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "No se recibieron datos"
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$data = json_decode($inputData, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Payload JSON invalido"
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

function countEquiposTexto($equiposTexto) {
    if (!is_string($equiposTexto) || trim($equiposTexto) === '') {
        return 0;
    }

    $items = array_filter(array_map('trim', explode(',', $equiposTexto)), function ($v) {
        return $v !== '';
    });

    return count($items);
}

function generarRegistroInboxId() {
    return 'REG-INBOX-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
}

try {
    $credentialsPath = realpath(__DIR__ . '/../private/google-service-account.json');
    if ($credentialsPath === false) {
        throw new Exception('No se encontro google-service-account.json');
    }

    $spreadsheetId = '1jU8GAVZAzNNWqFjrx5JbcHIHtO1e9OTkBqC7gTkV7_Y';
    $range = 'registros_inbox!A:V';

    putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $credentialsPath);

    $client = new Google\Client();
    $client->useApplicationDefaultCredentials();
    $client->setScopes([Google\Service\Sheets::SPREADSHEETS]);

    $service = new Google\Service\Sheets($client);

    $fechaRegistro = date('d/m/Y');
    $registroInboxId = generarRegistroInboxId();
    $cantidadEquipos = countEquiposTexto($data['equipos_texto'] ?? '');

    $row = [[
        $registroInboxId,                          // A registro_inbox_id
        $fechaRegistro,                            // B fecha_registro
        $data['fecha_ejecucion'] ?? '',            // C fecha_ejecucion
        $data['hora_ejecucion'] ?? '',             // D hora_ejecucion
        $data['sede_id'] ?? '',                    // E sede_id
        $data['sector_id'] ?? '',                  // F sector_id
        $data['tecnico_principal_texto'] ?? '',    // G tecnico_principal_texto
        $data['tecnico_secundario_texto'] ?? '',   // H tecnico_secundario_texto
        $data['tipo_trabajo_texto'] ?? '',         // I tipo_trabajo_texto
        $data['relacionado_texto'] ?? '',          // J relacionado_texto
        $data['subcategoria'] ?? '',               // K subcategoria
        $data['descripcion'] ?? '',                // L descripcion
        $data['observaciones'] ?? '',              // M observaciones
        $data['notas_adicionales'] ?? '',          // N notas_adicionales
        $data['origen_registro'] ?? 'Web técnico', // O origen_registro
        'Pendiente',                               // P estado_validacion
        !empty($data['es_excepcion']) ? 'TRUE' : 'FALSE', // Q es_excepcion
        $data['motivo_excepcion'] ?? '',           // R motivo_excepcion
        !array_key_exists('visible_en_informe', $data) || $data['visible_en_informe'] ? 'TRUE' : 'FALSE', // S visible_en_informe
        $data['periodo_informe'] ?? '',            // T periodo_informe
        $data['equipos_texto'] ?? '',              // U equipos_texto
        (string)$cantidadEquipos                   // V cantidad_equipos
    ]];

    $body = new Google\Service\Sheets\ValueRange([
        'values' => $row
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

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Fila insertada correctamente",
        "registro_inbox_id" => $registroInboxId,
        "updatedRange" => $response->getUpdates()->getUpdatedRange(),
        "updatedRows" => $response->getUpdates()->getUpdatedRows()
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error backend PHP: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
