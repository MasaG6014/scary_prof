<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SecretSharingController;

Route::get('/hello', function () {
    return response()->json(['message' => 'hello world']);
});

Route::post('/getShares',[ SecretSharingController::class , '@getShares']);