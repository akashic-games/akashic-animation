# akashic-animationサンプル
SpriteStudio6の新機能であるローカル不透明度を、`akashic-animation` で活用した例です

## 実行方法
[akashic-sandbox](https://github.com/akashic-games/akashic-sandbox) をインストールして、
次の手順を実行後ブラウザで <http://localhost:3000/game/> を開いてください。
```sh
$ npm install
$ npm run build
$ akashic-sandbox .
```

## 内容
画面に表示されている太陽のアイコンを灰色の人型物体に載せると、
載せたボーンの不透明度のみが変化して、裏に隠れている棒人間の部位を見られるようになります。
