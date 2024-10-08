# ChangeLog

## 4.2.0

* `Resource#loadProject()` に `g.AssetAccessor` (`scene.asset`, `game.asset`) を渡せるように修正
* Akashic Animation のデータの容量を削減する `ArrayOrientedPorter` を追加

## 4.1.0

* SpriteStudioで利用される補間方法の一部をサポート
  * 加速による補間方法をサポート
  * 減速による補間方法をサポート

## 4.0.0

* akashic-engine@3.0.0 に追従

## ## 4.0.0-beta.1

* akashic-engine@3.0.0-beta.28 に追従

## ## 4.0.0-beta.0

* akashic-engine@3.0.0-beta.17 系に追従。
* すでにプロジェクトをロード済みのリソースに対して`Resource#loadProject()`を実行すると以前ロードされた情報は削除されることをコメントに追加。
* アンカーを利用するとき正しく回転しない問題の修正

## 3.2.1

* アタッチメントが正しい位置に表示されない問題の修正。

## 3.2.0

* ファイルバージョン "3.0.0" に対応

## 3.1.0

* すでにプロジェクトをロード済みのリソースに対して`Resource#loadProject()`を実行すると以前ロードされた情報は削除されることをコメントに追加。
* Actorからパーティクルを放出する機能の追加

## 3.0.3

* セルの無いパーツについても `CircleCollider` が動作するように修正
* セルの無いパーツについても `BoneCellCollider` が動作するように修正
  * セルがない時、サイズが `(width, height) = (1.0, 1.0)` のセルと同等の判定になる

## 3.0.2

* AlphaBlendModeを `@akashic-extension/akashic-animation` から読み込めるように修正

## 3.0.1

* X/Yローカルスケール機能の追加
* ローカル不透明度機能の追加
* イメージの左右反転及び上下反転機能の追加
* セルの無いパーツ(rootパーツ等)の不透明度が反映されるように改修
* 以下のαブレンドモードに対応できるように改修
  * add

## 3.0.0

* akashic-engine@2.0.0 系に追従。

## 2.7.1

* TypeDocの実行に失敗する問題の修正。

## 2.7.0

* TypeScript 2.1 導入。

## 2.6.2

* 初期リリース。
