import { Point } from '../types';

/**
 * Ray Casting Algorithm
 * Determines if a point is inside a polygon.
 * 
 * @param point The user's location {lat, lng}
 * @param polygon Array of points defining the zone boundary
 * @returns boolean (true if inside)
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    const x = point.lat;
    const y = point.lng;

    let inside = false;

    // Loop through each edge of the polygon
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;

        // Check if the ray crosses the edge
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Validates if coordinates are real GPS numbers
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
}
