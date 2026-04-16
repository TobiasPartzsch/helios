import { Degrees, Radians } from "../angles";

export type RoutePoint = {
    timestampUtc: string;
    latDeg: Degrees;
    lonDeg: Degrees;
    label: string;
    note?: string;
};

export type RouteTrack = RoutePoint[];

export type RoutePointRad = {
    timestampUtc: number;
    latRad: Radians;
    lonRad: Radians;
    label: string;
    note?: string;
};

export type RoutePosition = {
    timestampUtc: number;
    latDeg: Degrees;
    lonDeg: Degrees;
    label?: string;
    note?: string;
};