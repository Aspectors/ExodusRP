import { Coords } from '../../types/client';
import { Client } from '../../types/index';
import Wait from './utils/delay';

let isHeistAvailable = true;
const pedSpawnCoords1: VectorPtr = [589.793396, -3282.593506, 5.060791, 0.0];
const secondPedSpawnCoords: VectorPtr = [657.138489, -778.430786, 23.545044, 172.913391];
const boat1SpawnVec4 = [583.503296, -3251.366943, -0.005127, 0];
const boat2SpawnVec4 = [583.200012, -3232.536377, -0.493774, 0];
const playersResetCoords = [588.593384, -3263.472412, 6.161865];
const pedModel = 'g_m_m_chicold_01';

export const Init = async (): Promise<void> => {
  let playerData = null;
  emit('esx:getSharedObject', async (obj: Client) => {
    playerData = obj.GetPlayerData();
    const i = obj.GetWeaponList();
    console.log(i);
  });

  const ped1status = await spawnInteractivePed(pedModel, pedSpawnCoords1);
  const ped2status = await spawnInteractivePed(pedModel, secondPedSpawnCoords);
  setTick(async () => {
    await Wait(100);
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

function isPlayerPolice(playerData) {
  return playerData?.job?.name === 'police';
}
function createTimerTickForHeist(vehicles: number[], players: number[]) {
  return setTimeout(() => {
    deleteEntity(vehicles);
    setPlayersResetCoords(players);
    // notify with esx
    emit('esx:showNotification', 'Heist Has Been Reset');
  }, 1000 * 60 * 10);
}

function deleteEntity(entity: number[]) {
  entity.forEach((entity: number) => {
    SetEntityAsMissionEntity(entity, false, false);
    DeleteEntity(entity);
  });
}
function setPlayersResetCoords(activePlayers: number[]) {
  activePlayers.forEach((player) => {
    SetEntityCoords(
      player,
      playersResetCoords[0],
      playersResetCoords[1],
      playersResetCoords[2],
      true,
      true,
      true,
      false
    );
  });
}

function handleHeistCooldown() {
  isHeistAvailable = false;
  setTimeout(() => {
    isHeistAvailable = true;
  }, 1000 * 60 * 1);
}

async function spawnBoat(coords: number[]) {
  const boatHash = 0xef813606;
  RequestModel(boatHash);
  while (!HasModelLoaded(boatHash)) {
    await Wait(1);
  }
  const boat = CreateVehicle(boatHash, coords[0], coords[1], coords[2], coords[3], true, false);
  return boat;
}

function monitorPlayerPositionRelativeToPed(pedCoords) {
  const playerCoords = GetEntityCoords(PlayerPedId(), true);
  const dist = GetDistanceBetweenCoords(
    playerCoords[0],
    playerCoords[1],
    playerCoords[2],
    pedCoords[0],
    pedCoords[1],
    pedCoords[2],
    true
  );
  return dist <= 2;
}

async function spawnInteractivePed(pedmodel, pedSpawnCoords) {
  const pedHash = GetHashKey(pedmodel);
  RequestModel(pedHash);
  while (!HasModelLoaded(pedHash)) {
    await Wait(1);
  }
  const playerPed = CreatePed(
    1,
    pedHash,
    pedSpawnCoords[0],
    pedSpawnCoords[1],
    pedSpawnCoords[2],
    pedSpawnCoords[3],
    true,
    false
  );

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
  emit('esx:getSharedObject', (obj: Client) => {
    const esx = obj;
  });

  const isPlayerInVehicle = IsPedInAnyVehicle(PlayerPedId(), false);
  if (isPlayerInVehicle) return;

  const isPlayerInBoat = IsPedInAnyBoat(PlayerPedId());

  if (isPlayerInBoat) return;

  const [boat1, boat2] = await Promise.all([spawnBoat(boat1SpawnVec4), spawnBoat(boat2SpawnVec4)]);
  const randomBoat = Math.random() > 0.5 ? boat1 : boat2;
  SetPedIntoVehicle(PlayerPedId(), randomBoat, -1);
  SetEntityAsMissionEntity(boat1, true, true);
  SetEntityAsMissionEntity(boat2, true, true);
  return [boat1, boat2];
}
