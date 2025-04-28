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

Route::post('/vote/leave', function () {
    Redis::decr('vote:access');
    return response()->json(['status' => 'ok']);
});

Route::post('manage/reset', function () {
    Redis::set('vote:access', 0);
    return response()->json(['status' => 'ok']);
});