import { Color4, CreateStreamingSoundAsync, DirectionalLight, Engine, FreeCamera, Scene, StreamingSound, Vector3 } from "@babylonjs/core";
import { GameState, IGameScene, IGameState } from "../types";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";

// TODO: IGNORE THIS FILE, PART OF A REFACTOR THAT I DIDNT HAVE TIME TO COMPLETE
export class StartGameScene implements IGameScene {
    private _engine: Engine;
    private _loaded: boolean;
    private _state: IGameState | undefined;
    private _scene: Scene | undefined;
    private _music: StreamingSound | undefined;

    public constructor(engine: Engine) {
        this._engine = engine;
        this._loaded = false;
    }
    
    public async load(state: IGameState): Promise<void> {
        if (this._loaded) {
            return;
        }
        console.log('loading');

        this._state = state;
        this._engine.displayLoadingUI();
        
        console.log('loading 2');

        // Scene basics
        this._scene = new Scene(this._engine);
        console.log(this._scene.uid);
        this._scene.clearColor = new Color4(0, 0, 0, 1);
        const light = new DirectionalLight('globalLight', new Vector3(0, -1, 0), this._scene);
        const camera = new FreeCamera('guiCamera', Vector3.Zero(), this._scene);
        camera.setTarget(Vector3.Zero());

        // Scene objects
        this._music = await CreateStreamingSoundAsync("intro", "../public/music.mp3", { autoplay: true, loop: true});

        // Scene GUI
        const startUI = AdvancedDynamicTexture.CreateFullscreenUI('startUI', true, this._scene);
        startUI.idealHeight = 1024;

        const playButton = Button.CreateSimpleButton('playButton', 'Play');
        playButton.width = 0.2;
        playButton.height = '40px';
        playButton.color = 'white';
        playButton.background = 'gray'
        playButton.cornerRadius = 5;
        playButton.fontSize = 25;
        playButton.onPointerDownObservable.add(async () => {
            console.log('STATE!!!' + this._state);
            this._state?.goToState(GameState.Play);
        });
        startUI.addControl(playButton);

        // Loading complete
        await this._scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        this._loaded = true;
    }

    public activate(): void {
        this._scene?.attachControl();
        this._music?.play();
    }

    public deactivate(): void {
        this._scene?.detachControl();
        this._music?.stop();
    }

    public render(): void {
        this._scene?.render;
    }

    public dispose(): void {
        this._music?.dispose();
        this._scene?.dispose();
    }
}