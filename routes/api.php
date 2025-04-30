<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
use Illuminate\Http\Request;

Route::get('/hello', function () {
    return response()->json(['message' => 'hello world']);
});

Route::post('/vote/access', function (Request $request) {
    Redis::incr('vote:access');
    $data = $request->all();
    $pk = $data['pk'];
    $pkList = Cache::get('pkList');
    $pkList = $pk;
    Cache::put($pk, [], 3600);
    Cache::put('pkList', $pkList, 3600);
    return response()->json(['status' => 'ok']);
});

Route::get('/vote/isStarted', function ()  {
    $isStart = Redis::get('vote:start');
    return response()->json(['isStarted'=> $isStart]);
});

Route::get('/vote/getPkList', function () {
    $pkList = Cache::get('pkList');
    return response()->json(['pkList' => $pkList]);
});

Route::post('/vote/postShares', function (Request $request) {
    $data = $request->all();
    $shares = $data['shares'];
    foreach ($shares as $pk => $share) {
        $shareList = Cache::get($pk);
        $shareList = $share;
        Cache::put($pk, $shareList, 3600);
    }
    Redis::incr('vote:tallyReady');
});

Route::get('/vote/isTallyReady', function () {
    $isTallyReady = Redis::get('vote:tallyReady');
    return response()->json(['isTallyReady' => $isTallyReady]);
});

Route::post('vote/tally', function(Request $request) {
    $data = $request->all();
    $pk = $data['pk'];
    $shares = Cache::get($pk);
    return response() -> json(['shares' => $shares]);
});

Route::post('vote/postResultShare', function (Request $request) {
    $data = $request->all();
    $resultShare = $data['resultShare'];
    $res = Cache::get('result');
    $res = $resultShare;
    Cache::put('result', $res, 3600);
    Redis::incr('numOfResultShares');
    if (Redis::get('numOfResultShares') == Redis::get('vote:access')) {
        Redis::set('isTallyOver', 1);
    }
});

Redis::get('/vote/isTallyOver', function () {
    $isTallyOver = Redis::get('isTallyOver');
    return response()->json(['isTallyOver' => $isTallyOver]);
});

Redis::get('getResultShares', function () {
    $resultShares = Cache::get('result');
    return response()->json(['resultShares' => $resultShares]);
});

Route ::get('/vote/count', function () {
    $count = Redis::get('vote:access');
    return response()->json(['count' => $count]);
});

Route::post('/vote/leave', function () {
    Redis::decr('vote:access');
    return response()->json(['status' => 'ok']);
});



Route::post('/manage/reset', function () {
    Redis::set('vote:access', 0);
    return response()->json(['status' => 'ok']);
});

Route::post('/manage/start', function () {
    Redis::set('vote:start', 1);
    return response()->json(['status' => 'ok']);
});

Route::get('/manage/tallyReady', function () {
    $tallyReady = Redis::get('vote:tallyReady');
    return response()->json(['tallyReady' => $tallyReady]);
});


Route::post('/manage/tally', function () {
    Redis::set('vote:start',0);
    Redis::set('vote:tallyStart',1);
    return response()->json(['status' => 'ok']);
});