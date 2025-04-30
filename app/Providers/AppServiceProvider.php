<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        
        // ローカル環境でのみ、かつ初回リクエスト時に Redis 初期化処理を行う例
        if ($this->app->environment('local')) {
            $flagPath = storage_path('framework/redis_initialized');
            if (!file_exists($flagPath)) { // 初回実行の場合のみ
                Redis::set('vote:access', 0);
                Redis::set('vote:start', 0);
                Cache::put('pkList',[], 3600);
                Redis::set('vote:tallyReady', 0);
                Redis::set('vote:tallyStart', 0);
                Cache::put('result', [], 3600);
                Redis::set('numOfResultShares', 0);
                Redis::set('isTallyOver',0);
                // 必要に応じて他のキーの初期化も行う
                file_put_contents($flagPath, '1'); // 初期化済みフラグを作成
            }
        }
    }
}
