<?php
// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Set content type to JSON
header('Content-Type: application/json');

// Get the CSRF token
$token = csrf_token();

// Return the token
echo json_encode([
    'csrf_token' => $token
]);
