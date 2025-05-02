# 怖くないよ^^

## リポジトリのクローン

```bash
git clone https://github.com/MasaG6014/scary_prof.git
cd scary_prof
```

## バックエンド（Laravel）セットアップ手順

以下の手順で Laravel サーバーをセットアップしてください。


### 依存関係をインストール
```bash
composer install
```
### 環境ファイルをコピー
``` bash
cp .env.example .env
```

### アプリケーションキーを生成
```bash
php artisan key:generate
```

### データベースをマイグレート（テーブル作成）
```bash
php artisan migrate
```

### 開発サーバーを起動
``` bash
php artisan serve
```

## フロントエンド（Vue + Vite）セットアップ手順
```bash
以下の手順で Vue フロントエンド環境を構築してください。
```

### 依存関係をインストール
```bash
npm install
```

### 開発モードでアセットをビルド・監視
```bash
npm run dev
```