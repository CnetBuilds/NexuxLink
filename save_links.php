<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$file = 'links_db.txt';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['links'])) {
        $data = json_encode($input['links'], JSON_PRETTY_PRINT);
        if (file_put_contents($file, $data) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to write file']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
