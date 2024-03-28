<?php
// JSON file path
$jsonFile = 'data.json';

// Load data from the JSON file
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'loadGuests') {
  if (file_exists($jsonFile)) {
    $jsonData = file_get_contents($jsonFile);
    $data = json_decode($jsonData, true);
    echo json_encode($data);
  } else {
    echo json_encode(['guests' => [], 'notes' => '']);
  }
}

// Save data to the JSON file
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $requestData = json_decode(file_get_contents('php://input'), true);
  if ($requestData['action'] === 'saveGuests') {
    $data = [
      'guests' => $requestData['guests'],
      'notes' => $requestData['notes']
    ];
    file_put_contents($jsonFile, json_encode($data));
    echo json_encode(['success' => true]);
  }
}
?>