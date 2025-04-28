<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;

Route::get('/hello', function () {
    return response()->json(['message' => 'hello world']);
});

Route::post('/vote/access', function () {
    Redis::incr('vote:access');
    return response()->json(['status' => 'ok']);
});

Route ::get('/vote/count', function () {
    $count = Redis::get('vote:access');
    return response()->json(['count' => $count]);
});