<?php

use App\Http\Controllers\TradingController;
use App\Http\Controllers\RiskManagementController;
use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public Trading API Routes
Route::get('/trading/current-price', [TradingController::class, 'getCurrentPrice']);
Route::get('/trading/chart-data', [TradingController::class, 'getChartData']);

// Protected Trading API Routes
Route::middleware('auth:sanctum')->group(function () {
    // Trading data endpoints
    Route::get('/trading/symbol-details', [TradingController::class, 'getSymbolDetails']);
    
    // Trading positions endpoints
    Route::post('/trading/positions', [TradingController::class, 'store']);
    Route::post('/trading/positions/{id}/close', [TradingController::class, 'closePosition']);
    
    // Trading orders endpoints
    Route::get('/trading/orders', [TradingController::class, 'getOrders']);
    Route::post('/trading/orders', [TradingController::class, 'createOrder']);
    Route::put('/trading/orders/{id}', [TradingController::class, 'updateOrder']);
    Route::delete('/trading/orders/{id}', [TradingController::class, 'cancelOrder']);

    // Notifications
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/notifications', [NotificationController::class, 'getNotifications']);
        Route::get('/notifications/count', [NotificationController::class, 'getUnreadCount']);
        Route::post('/notifications/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'deleteNotification']);
    });

    // Risk Management API Routes
    Route::post('/risk-management/calculate-position-size', [RiskManagementController::class, 'calculatePositionSize'])
        ->name('api.risk.calculatePositionSize');
});
