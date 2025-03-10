import * as BABYLON from '@babylonjs/core';
import { PongGame } from './pongGame';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import HavokPhysics from '@babylonjs/havok';

export class Application {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private game: PongGame | undefined;

  public constructor() {
    // HTML setup
    this.canvas = document.createElement('canvas');
    document.body.appendChild(this.canvas);
    this.canvas.id = 'renderCanvas';
    
    // Create the engine
    this.engine  = new BABYLON.Engine(this.canvas, true, undefined, true);
  }

  public async initialize() {
    await BABYLON.CreateAudioEngineAsync();
    const havokInstance = await HavokPhysics();
    const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);

    this.game = new PongGame(this.engine, havokPlugin);
    await this.game.startState();
    this.addEventListeners();

    this.engine.runRenderLoop(() => {
      this.renderLoop();     
    });
  }

  private renderLoop(): void {
    this.game?.activeScene?.render();
  }

  private addEventListeners() {
    window.addEventListener('resize', () => {
      this.engine.resize();
    });

    window.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey && ev.code === 'KeyI') {
        if (this.game?.activeScene) {
          if (this.game.activeScene.debugLayer.isVisible()) {
            this.game.activeScene.debugLayer.hide();
          } else {
            this.game.activeScene.debugLayer.show();
          }
        }
      }
    });
  }
}

const app = new Application();
await app.initialize();