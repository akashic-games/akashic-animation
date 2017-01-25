# akashic-animationサンプル
これは `Attachment` クラスの利用例です。

## 実行方法
[akashic-sandbox](https://github.com/akashic-games/akashic-sandbox) をインストールして、
次の手順を実行後ブラウザで <http://localhost:3000/game/> を開いてください。
```sh
$ npm install
$ npm run build
$ akashic-sandbox .
```

## 内容
* 松明アクターをランナーアクターの左手に取り付けます。`Attachment`クラスの派生クラスとして`ActorAttachment`を実装することで実現しています。

## 操作方法
各機能は画面上部のトグルボタンをクリックすることで操作できます。

* Boneボタン: ボーンの表示・非表示を切り替えます。
* Torchボタン: 松明アクターの取り付け、取り外しを切り替えます。
