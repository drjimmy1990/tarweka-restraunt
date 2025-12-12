import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isPointInPolygon, isValidCoordinate } from '../utils/geoUtils';
import { Branch, CoverageResponse, Zone } from '../types';

export const checkCoverage = async (req: Request, res: Response) => {
    try {
        let { lat, lng } = req.body;

        // Ensure they are numbers (in case n8n sends strings)
        lat = parseFloat(lat);
        lng = parseFloat(lng);

        // 1. Validation
        if (!isValidCoordinate(lat, lng)) {
            return res.status(400).json({ error: 'Invalid coordinates provided' });
        }

        // 2. Fetch Active Branches & Zones from DB
        // We only want branches that are marked 'is_active' = true
        const { data: branches, error } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true);

        if (error || !branches) {
            console.error('DB Error:', error);
            return res.status(500).json({ error: 'Failed to fetch branch data' });
        }

        // 3. The Search Logic
        const userLocation = { lat, lng };
        let bestMatch: CoverageResponse = { covered: false };

        // Loop through every branch
        for (const branchData of branches) {
            const branch = branchData as Branch;

            // Safety check: ensure zones exist
            if (!branch.zones || !Array.isArray(branch.zones)) continue;

            // Loop through every zone in this branch
            for (const zone of branch.zones) {
                const isInside = isPointInPolygon(userLocation, zone.polygon);

                if (isInside) {
                    // FOUND IT!
                    // We return immediately on the first match.
                    // (In complex apps, you might compare multiple matches for the cheapest fee)
                    return res.json({
                        covered: true,
                        branch_id: branch.id,
                        branch_name: branch.name,
                        zone_name: zone.name,
                        delivery_fee: zone.delivery_fee
                    });
                }
            }
        }

        // 4. No Match Found
        return res.json({
            covered: false,
            message: 'Location is outside all delivery zones.'
        });

    } catch (err: any) {
        console.error('Geo Controller Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
