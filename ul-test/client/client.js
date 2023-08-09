/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/client/client.ts":
/*!******************************!*\
  !*** ./src/client/client.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Controllers = __importStar(__webpack_require__(/*! ./controllers/index */ "./src/client/controllers/index.ts"));
(async () => {
    await Controllers.Init();
})();


/***/ }),

/***/ "./src/client/controllers/index.ts":
/*!*****************************************!*\
  !*** ./src/client/controllers/index.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Init = void 0;
const delay_1 = __importDefault(__webpack_require__(/*! ./utils/delay */ "./src/client/controllers/utils/delay.ts"));
let isHeistAvailable = true;
const pedSpawnCoords1 = [589.793396, -3282.593506, 5.060791, 0.0];
const secondPedSpawnCoords = [657.138489, -778.430786, 23.545044, 172.913391];
const boat1SpawnVec4 = [583.503296, -3251.366943, -0.005127, 0];
const boat2SpawnVec4 = [583.200012, -3232.536377, -0.493774, 0];
const playersResetCoords = [588.593384, -3263.472412, 6.161865];
const pedModel = 'g_m_m_chicold_01';
const Init = async () => {
    let playerData = null;
    emit('esx:getSharedObject', async (obj) => {
        playerData = obj.GetPlayerData();
        const i = obj.GetWeaponList();
        console.log(i);
    });
    const ped1status = await spawnInteractivePed(pedModel, pedSpawnCoords1);
    const ped2status = await spawnInteractivePed(pedModel, secondPedSpawnCoords);
    setTick(async () => {
        await (0, delay_1.default)(100);
        if (isHeistAvailable && !isPlayerPolice(playerData)) {
            // heist is available
            if (ped1status?.pedCreated && ped2status?.pedCreated) {
                // ped is created
                if (monitorPlayerPositionRelativeToPed(ped1status.pedHash)) {
                    // player is near ped
                    const boats = await configureHeist();
                    const setTimeoutref = createTimerTickForHeist(boats, [PlayerPedId()]);
                }
            }
        }
    });
};
exports.Init = Init;
function isPlayerPolice(playerData) {
    return playerData?.job?.name === 'police';
}
function createTimerTickForHeist(vehicles, players) {
    return setTimeout(() => {
        deleteEntity(vehicles);
        setPlayersResetCoords(players);
        // notify with esx
        emit('esx:showNotification', 'Heist Has Been Reset');
    }, 1000 * 60 * 10);
}
function deleteEntity(entity) {
    entity.forEach((entity) => {
        SetEntityAsMissionEntity(entity, false, false);
        DeleteEntity(entity);
    });
}
function setPlayersResetCoords(activePlayers) {
    activePlayers.forEach((player) => {
        SetEntityCoords(player, playersResetCoords[0], playersResetCoords[1], playersResetCoords[2], true, true, true, false);
    });
}
function handleHeistCooldown() {
    isHeistAvailable = false;
    setTimeout(() => {
        isHeistAvailable = true;
    }, 1000 * 60 * 1);
}
async function spawnBoat(coords) {
    const boatHash = 0xef813606;
    RequestModel(boatHash);
    while (!HasModelLoaded(boatHash)) {
        await (0, delay_1.default)(1);
    }
    const boat = CreateVehicle(boatHash, coords[0], coords[1], coords[2], coords[3], true, false);
    return boat;
}
function monitorPlayerPositionRelativeToPed(pedCoords) {
    const playerCoords = GetEntityCoords(PlayerPedId(), true);
    const dist = GetDistanceBetweenCoords(playerCoords[0], playerCoords[1], playerCoords[2], pedCoords[0], pedCoords[1], pedCoords[2], true);
    return dist <= 2;
}
async function spawnInteractivePed(pedmodel, pedSpawnCoords) {
    const pedHash = GetHashKey(pedmodel);
    RequestModel(pedHash);
    while (!HasModelLoaded(pedHash)) {
        await (0, delay_1.default)(1);
    }
    const playerPed = CreatePed(1, pedHash, pedSpawnCoords[0], pedSpawnCoords[1], pedSpawnCoords[2], pedSpawnCoords[3], true, false);
    SetEntityInvincible(playerPed, true);
    SetBlockingOfNonTemporaryEvents(playerPed, true);
    FreezeEntityPosition(playerPed, true);
    SetModelAsNoLongerNeeded(pedHash);
    return {
        pedCreated: playerPed != 0,
        pedHash: pedHash != 0 ? pedHash : null,
    };
}
async function configureHeist() {
    handleHeistCooldown();
    emit('esx:getSharedObject', (obj) => {
        const esx = obj;
    });
    const isPlayerInVehicle = IsPedInAnyVehicle(PlayerPedId(), false);
    if (isPlayerInVehicle)
        return;
    const isPlayerInBoat = IsPedInAnyBoat(PlayerPedId());
    if (isPlayerInBoat)
        return;
    const [boat1, boat2] = await Promise.all([spawnBoat(boat1SpawnVec4), spawnBoat(boat2SpawnVec4)]);
    const randomBoat = Math.random() > 0.5 ? boat1 : boat2;
    SetPedIntoVehicle(PlayerPedId(), randomBoat, -1);
    SetEntityAsMissionEntity(boat1, true, true);
    SetEntityAsMissionEntity(boat2, true, true);
    return [boat1, boat2];
}


/***/ }),

/***/ "./src/client/controllers/utils/delay.ts":
/*!***********************************************!*\
  !*** ./src/client/controllers/utils/delay.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
function default_1(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}
exports["default"] = default_1;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/client/client.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=client.js.map