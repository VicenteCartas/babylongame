import { Color4, CreateStreamingSoundAsync, Engine, FreeCamera, Scene, StreamingSound, Vector3 } from "@babylonjs/core";
import { GameState, IGameScene, IGameState } from "../types";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";

// TODO: IGNORE THIS FILE, PART OF A REFACTOR THAT I DIDNT HAVE TIME TO COMPLETE
export class EndGameScene implements IGameScene {
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

        this._state = state;
        this._engine.displayLoadingUI();
        
        // Scene basics
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0, 0, 0, 1);
        const camera = new FreeCamera('guiCamera', Vector3.Zero(), this._scene);
        camera.setTarget(Vector3.Zero());
        
        // Scene objects
        this._music = await CreateStreamingSoundAsync("intro", "../public/intro.mp3", { loop: true});
        
        // Scene GUI
        const loseUI = AdvancedDynamicTexture.CreateFullscreenUI('loseUI');
        loseUI.idealHeight = 1024;

        const endOfGameText: string = this._state.leftPlayerScore > this._state.rightPlayerScore
            ? `Left player won ${this._state.leftPlayerScore}-${this._state.rightPlayerScore}. Go to main menu`
            : `Right player won ${this._state.leftPlayerScore}-${this._state.rightPlayerScore}. Go to main menu`

        const mainMenuButton = Button.CreateSimpleButton('mainMenuButton', endOfGameText);
        mainMenuButton.width = 0.3;
        mainMenuButton.height = '40px';
        mainMenuButton.color = 'white';
        mainMenuButton.background = 'gray'
        mainMenuButton.cornerRadius = 5;
        mainMenuButton.fontSize = 25;
        mainMenuButton.onPointerDownObservable.add(() => {
            console.log('STATE!!!' + this._state);
            this._state?.goToState(GameState.Start);
        });
        loseUI.addControl(mainMenuButton);

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