# akashic-animationサンプル
イメージ左右反転及び上下反転機能の活用例です

## 実行方法
[akashic-sandbox](https://github.com/akashic-games/akashic-sandbox) をインストールして、
次の手順を実行後ブラウザで <http://localhost:3000/game/> を開いてください。
```sh
$ npm install
$ npm run build
$ akashic-sandbox .
```

## 内容
クリックした画像パーツが左右反転もしくは上下反転します。  
対象画像パーツをクリックした時に起こる挙動は以下の通りです。  
* どちらか片方の棒人間の顔をクリックすると、両方の棒人間の顔パーツが左右反転します。
* どちらか片方の星をクリックすると、両方の星パーツが上下反転します。