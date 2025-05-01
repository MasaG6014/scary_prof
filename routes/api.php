<?php

use Illuminate\Redis\RedisServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

Route::get('/hello', function () {
    return response()->json(['message' => 'hello world']);
});

Route::post('/vote/getPkInfo', function (Request $request) {
    $data = $request->all();
    $pk = (string)($data['pk'] ?? '');
    $info = Cache::get($pk, []);
    if (!is_array($info)) {
        $info = [];
    }
    return response()->json(['info' => $info]);
});



Route::get('/vote/getState', function () {
    $state = Redis::get('vote:state');
    return response()->json(['state' => $state]);
});

Route::post('/vote/goVoting', function(){
    Redis::set('vote:state', "voting");
    return response()->json(['status' => 'ok']);
});

Route::post('/vote/goTally', function(){
    Redis::set('vote:state', "tallying");
    return response()->json(['status' => 'ok']);
});

Route::post('/vote/tallyDone', function(){
    Redis::set('vote:state', "done");
    return response()->json(['status' => 'ok']);
});



Route::post('/vote/access', function (Request $request) {
    Redis::incr('vote:access');
    $data = $request->all();
    $pk = (string)($data['pk'] ?? '');
    // Log::debug("content of $pk: ",$pk);
    $pkList = Cache::get('pkList', []);
    if (!is_array($pkList)) {
        $pkList = [];
    }
    $pkList[] = $pk;
    Cache::put($pk, [], 3600);
    Cache::put('pkList', $pkList, 3600);
    return response()->json(['status' => 'ok', 'pk' => $pk, 'pkList' => $pkList]);
});

Route::get('/vote/getPkList', function () {
    $pkList = Cache::get('pkList', []);
    return response()->json(['pkList' => $pkList]);
});

Route::post('/vote/postShares', function (Request $request) {
    $data = $request->all();
    $shares = $data['shares'];
    foreach ($shares as $shareItem) {
        $pk = $shareItem['pk'];
        $share = $shareItem['share'];
        $shareList = Cache::get($pk, []);
        if (!is_array($shareList)) {
            $shareList = [];
        }
        $shareList[] = $share;
        Cache::put($pk, $shareList, 3600);
    }
    Redis::incr('vote:tallyReady');
});


Route::post('vote/tally', function(Request $request) {
    $data = $request->all();
    $pk = $data['pk'];
    $shares = Cache::get($pk);
    return response() -> json(['shares' => $shares]);
});

Route::post('vote/postResultShares', function (Request $request) {
    $data = $request->all();
    $resultShare = $data['resultShares'];
    $res = Cache::get('result',[]);
    if (!is_array($res)) {
        $res = [];
    }
    $res[] = $resultShare;
    Cache::put('result', $res, 3600);
    Redis::incr('numOfResultShares');
    if (Redis::get('numOfResultShares') == Redis::get('vote:access')) {
        Redis::set('vote:state', "tallyDone");
    }
});

Route::get('/vote/isTallyOver', function () {
    $isTallyOver = Redis::get('isTallyOver');
    return response()->json(['isTallyOver' => $isTallyOver]);
});

Route::get('/vote/getResultShares', function () {
    $resultShares = Cache::get('result');
    return response()->json(['resultShares' => $resultShares]);
});

Route ::get('/vote/getCount', function () {
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
    Redis::set('vote:state', "voting");
    return response()->json(['status' => 'ok']);
});

Route::get('/manage/getTallyReady', function () {
    $tallyReady = Redis::get('vote:tallyReady');
    return response()->json(['tallyReady' => $tallyReady]);
});


Route::post('/manage/tally', function () {
    Redis::set('vote:state', "tallying");
    return response()->json(['status' => 'ok']);
});

Route::get('/manage/leave', function () {
    Redis::set('vote:access', 0);
    Cache::put('pkList',[], 3600);
    Redis::set('vote:tallyReady', 0);
    Redis::set('vote:tallyStart', 0);
    Cache::put('result', [], 3600);
    Redis::set('numOfResultShares', 0);
    Redis::set('vote:state', "waiting");
    return response() -> json(['status' => 'ok']);
});