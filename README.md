# 怖くないよ^^

## リポジトリのクローン

```bash
git clone https://github.com/MasaG6014/scary_prof.git
cd scary_prof
```

## 環境変数の追加
.env.exampleを.envにリネームして、以下の環境変数を設定してください。

## アプリを動かす
サーバーの起動
```bash
docker compose up --buiild -d 
```
サーバーの停止
```bash
docker compose down
```
localhost:8000にアクセスするとアプリのページにアクセスできます  
アンケートを始めるには/manageにアクセスしてとりあえずResetをクリックしてください  
progress: waitingになったらOKです  
別のタブかウィンドウから/voteにアクセスすると、numbre of voterが増えると思います  
規定の人数アクセスできたらstartを押してください。progree: votingになったらOKです  
投票者側でテキストボックスが表示されるので、0~100の数字を入力してsubmitしてください。mangae側でnumber of ballotが増えます。  
voterとballotの数が一致したらtallyを押してください。voter側に集計結果の平均値が表示されます。  