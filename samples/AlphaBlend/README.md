# akashic-animationサンプル
α-ブレンド機能の活用例です

## 実行方法
[akashic-sandbox](https://github.com/akashic-games/akashic-sandbox) をインストールして、
次の手順を実行後ブラウザで <http://localhost:3000/game/> を開いてください。
```sh
$ npm install
$ npm run build
$ akashic-sandbox .
```

## 内容
ボタンを押すと剣のαブレンドが変わります。ボタン以外を押すと背景色が変わります。
なお、剣のαブレンドと背景色は以下のような順番で変わっていきます。
* 剣のαブレンド：通常 -> 加算
* 背景色： white -> gray -> blue -> navy -> teal -> green -> lime -> aqua -> blue -> yellow -> fuchsia -> olive -> purple -> maroon
