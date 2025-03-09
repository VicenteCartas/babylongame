import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { IGameEntity, IGameState } from "../types";

// Represents the table where the game takes place
export class PongTable implements IGameEntity {
    private _scene: Scene;
    private _loaded:  boolean;
    private _groundMesh: Mesh | undefined;
    private _topMesh: Mesh | undefined;
    private _bottomMesh: Mesh | undefined;
    private _leftMesh: Mesh | undefined;
    private _rightMesh: Mesh | undefined;

    public constructor(scene: Scene) {
        this._scene = scene;
        this._loaded = false;
    }
    
    public async load(state: IGameState) : Promise<void> {
        if (this._loaded) {
            return;
        }

        // Ground for our game
        this._groundMesh = MeshBuilder.CreateGround(
            'ground', {
                width: 20,
                height: 10
            },
        this._scene);
        const groundMaterial = new StandardMaterial('defaultMaterial');
        const groundTexture = new Texture('../logo.png', this._scene);
        groundMaterial.diffuseTexture = groundTexture;
        this._groundMesh.material = groundMaterial;
        this._groundMesh.checkCollisions = false;

        // Top boundaries
        const boundariesTexture = new Texture('../red-blue.png', this._scene, { samplingMode: Texture.CLAMP_ADDRESSMODE});
        const boundariesMaterial = new StandardMaterial('boundariesMaterial');
        boundariesMaterial.diffuseTexture = boundariesTexture;
        this._topMesh = MeshBuilder.CreateBox(
            'top', {
                width: 20,
                height: 1,
                depth: 0.5,
                wrap: true
            },
            this._scene);
        this._topMesh.position = new Vector3(0, 0.5, 4.75);
        this._topMesh.material = boundariesMaterial;

        this._bottomMesh = MeshBuilder.CreateBox(
            'bottom', {
                width: 20,
                height: 1,
                depth: 0.5,
                wrap: true
            },
            this._scene);
        this._bottomMesh.position = new Vector3(0, 0.5, -4.75);
        this._bottomMesh.material = boundariesMaterial;

        // Side goals
        this._leftMesh = MeshBuilder.CreateBox(
            'leftGoal', {
                width: 0.5,
                height: 1,
                depth: 9
            },
            this._scene);
        this._leftMesh.position = new Vector3(-9.75, 0.5, 0);
        const leftGoalMaterial = new StandardMaterial('leftGoalMaterial');
        leftGoalMaterial.diffuseColor = Color3.Red();
        this._leftMesh.material = leftGoalMaterial;

        this._rightMesh = MeshBuilder.CreateBox(
            'rightGoal', {
                width: 0.5,
                height: 1,
                depth: 9
            },
            this._scene);
        this._rightMesh.position = new Vector3(9.75, 0.5, 0);
        const rightGoalMaterial = new StandardMaterial('leftGoalMaterial');
        rightGoalMaterial.diffuseColor = Color3.Blue();
        this._rightMesh.material = rightGoalMaterial;

        this._loaded = true;
    }

    public update(): void {
    }

    public reset(): void {
    }

    public dispose(): void {
        this._groundMesh?.dispose();
        this._topMesh?.dispose();
        this._bottomMesh?.dispose();
        this._leftMesh?.dispose();
        this._rightMesh?.dispose();
        this._loaded = false;
    }
}