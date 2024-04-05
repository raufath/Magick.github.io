<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// JSON file path
$jsonFile = 'data.json';

// Function to log and return error
function returnError($message) {
    error_log($message);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

// Check if the JSON file exists
if (!file_exists($jsonFile)) {
    // Create the initial JSON data
    $initialData = [
        'guests' => [],
        'notes' => ''
    ];

    // Save the initial data to the JSON file
    $jsonData = json_encode($initialData, JSON_PRETTY_PRINT);
    if (file_put_contents($jsonFile, $jsonData) === false) {
        returnError("Failed to create $jsonFile");
    }
}

// Load data from the JSON file
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'loadGuests') {
        if (file_exists($jsonFile)) {
            $jsonData = file_get_contents($jsonFile);
            if ($jsonData === false) {
                returnError("Failed to read from $jsonFile");
            }

            $data = json_decode($jsonData, true);
            if ($data === null) {
                returnError("Failed to decode JSON data from $jsonFile");
            }

            echo json_encode($data);
        } else {
            returnError("File $jsonFile does not exist.");
        }
    }
}

// Save data to the JSON file
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $requestData = json_decode(file_get_contents('php://input'), true);
    if ($requestData === null) {
        returnError("Failed to decode JSON request data");
    }

    error_log('Received data: ' . json_encode($requestData));

    if (isset($requestData['action']) && $requestData['action'] === 'saveGuests') {
        $data = [
            'guests' => $requestData['guests'],
            'notes' => $requestData['notes']
        ];
        $jsonData = json_encode($data, JSON_PRETTY_PRINT);
        if ($jsonData === false) {
            returnError("Failed to encode JSON data for $jsonFile");
        }

        if (file_put_contents($jsonFile, $jsonData) === false) {
            returnError("Failed to save data to $jsonFile");
        } else {
            echo json_encode(['success' => true]);
        }
    } else {
        returnError("Invalid request action");
    }
}
?>