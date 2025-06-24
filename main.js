// --- Unit Factories ---
// Functions to create different unit types, encapsulating their unique behaviors.

/**
 * Creates a generic unit object.
 * @param {number} baseStrength - The unit's inherent starting strength.
 * @param {string} type - The unit's classification (Pikeman, Archer, Knight).
 * @param {number} [initialAge=0] - Starting age of the unit.
 * @returns {object} A unit with its properties and actions.
 */
const createUnit = (baseStrength, type, initialAge = 0) => {
    let currentStrength = baseStrength;
    let age = initialAge;

    return {
        type: type,
        getStrength: () => currentStrength,
        getYearsOfLife: () => age,
        /**
         * Increases the unit's current strength.
         * @param {number} pointsGained - Strength added from training.
         */
        train: (pointsGained) => {
            currentStrength += pointsGained;
        },
        /**
         * Directly sets the unit's strength. Useful for transformations where base strength changes.
         * @param {number} newStrength - The new total strength for the unit.
         */
        setStrength: (newStrength) => {
            currentStrength = newStrength;
        }
    };
};

// Specific unit types, pre-configured with their base strengths.
const createPikeman = (initialAge = 0) => createUnit(5, "Pikeman", initialAge);
const createArcher = (initialAge = 0) => createUnit(10, "Archer", initialAge);
const createKnight = (initialAge = 0) => createUnit(20, "Knight", initialAge);


// --- Army Factory ---
/**
 * Creates an army for a specific civilization.
 * @param {string} civilizationType - "Chinos", "Ingleses", or "Bizantinos".
 * @param {string} armyName - A unique identifier for this army.
 * @returns {object} An army object ready for action.
 */
const createArmy = (civilizationType, armyName) => {
    let gold = 1000;
    let units = [];
    let battleHistory = [];

    // Sets up the initial units based on the chosen civilization.
    const initializeUnits = () => {
        const initialUnitConfigs = {
            "Chinos": { pikemen: 2, archers: 25, knights: 2 },
            "Ingleses": { pikemen: 10, archers: 10, knights: 10 },
            "Bizantinos": { pikemen: 5, archers: 8, knights: 15 }
        };

        const config = initialUnitConfigs[civilizationType];
        if (config) {
            for (let i = 0; i < config.pikemen; i++) units.push(createPikeman());
            for (let i = 0; i < config.archers; i++) units.push(createArcher());
            for (let i = 0; i < config.knights; i++) units.push(createKnight());
        } else {
            console.warn(`Army ${armyName}: Unknown civilization type "${civilizationType}". No units initialized.`);
        }
    };

    initializeUnits(); // Build the army's initial forces.

    // Removes units after a defeat or tie.
    const loseUnits = (count) => {
        units.sort((a, b) => b.getStrength() - a.getStrength()); // Sort by strength, descending.
        units.splice(0, count); // Remove the strongest units.
    };

    // Helper to add gold to the army's treasury.
    const addGold = (amount) => {
        gold += amount;
    };

    // Helper to deduct gold from the army's treasury.
    const deductGold = (amount) => {
        if (gold >= amount) {
            gold -= amount;
            return true;
        }
        return false; // Insufficient funds.
    };

    // Calculates the total combined strength of all units in the army.
    const getTotalStrength = () => units.reduce((sum, unit) => sum + unit.getStrength(), 0);


    return {
        armyName,
        civilization: civilizationType,
        getGold: () => gold,
        getUnits: () => [...units], // Return a copy to protect internal state.
        getBattleHistory: () => [...battleHistory],

        getTotalStrength: getTotalStrength, // Expose the function directly

        // Expose addGold and deductGold as public methods,
        // but also directly use them internally via their const names.
        addGold: addGold, // Exposing for external use
        deductGold: deductGold, // Exposing for external use

        /**
         * Trains a specific unit, improving its strength.
         * @param {object} unitToTrain - The unit to enhance.
         * @returns {boolean} True if training was successful.
         */
        trainUnit: (unitToTrain) => {
            let cost = 0;
            let pointsGained = 0;
            
            if(!unitToTrain) {
              console.log(`Army ${armyName}: Error – No unit found.`);
              return false;
            }

            switch (unitToTrain.type) {
                case "Pikeman": cost = 10; pointsGained = 3; break;
                case "Archer": cost = 20; pointsGained = 7; break;
                case "Knight": cost = 30; pointsGained = 10; break;
                default: console.error(`Army ${armyName}: Can't train unknown unit type "${unitToTrain.type}".`); return false;
            }

            if (gold < cost) {
                console.log(`Army ${armyName}: Not enough gold to train ${unitToTrain.type} (have ${gold}, need ${cost}).`);
                return false;
            }

            if (deductGold(cost)) {
                unitToTrain.train(pointsGained);
                console.log(`Army ${armyName}: Trained a ${unitToTrain.type}. Gold: ${gold}, Unit Strength: ${unitToTrain.getStrength()}`);
                return true;
            }
            return false; // Should not happen if gold check passes.
        },

        /**
         * Transforms a unit into a higher-tier unit, preserving accumulated training.
         * @param {object} originalUnit - The unit to transform.
         * @returns {boolean} True if transformation was successful.
         */
        transformUnit: (originalUnit) => {
            let newUnitFactory = null; // Unit that transforms to
            let newUnitBaseStrength = 0; // Unit that transforms to default points
            let cost = 0;

            if(!originalUnit) {
              console.log(`Army ${armyName}: Error – No unit found.`);
              return false;
            }

            const originalStrength = originalUnit.getStrength(); // Points in total
            let originalUnitBaseStrength = 0; // Points by default of the unit (5, 10, 20)

            // Determine transformation rules based on original unit type.
            switch (originalUnit.type) {
                case "Pikeman":
                    originalUnitBaseStrength = 5;
                    newUnitFactory = createArcher;
                    newUnitBaseStrength = 10;
                    cost = 30;
                    break;
                case "Archer":
                    originalUnitBaseStrength = 10;
                    newUnitFactory = createKnight;
                    newUnitBaseStrength = 20;
                    cost = 40;
                    break;
                case "Knight":
                    console.log(`Army ${armyName}: Knights cannot be transformed.`);
                    return false;
                default:
                    console.error(`Army ${armyName}: Can't transform unknown unit type "${originalUnit.type}".`);
                    return false;
            }

            if (gold < cost) {
                console.log(`Army ${armyName}: Not enough gold to transform ${originalUnit.type} (have ${gold}, need ${cost}).`);
                return false;
            }

            if (deductGold(cost)) {
                const index = units.indexOf(originalUnit);
                if (index > -1) {
                    // Calculate training gained beyond base strength.
                    const accumulatedTraining = originalStrength - originalUnitBaseStrength;

                    // Create the new unit, carrying over the age.
                    const newUnit = newUnitFactory(originalUnit.getYearsOfLife());
                    // Apply new base strength plus inherited training.
                    newUnit.setStrength(newUnitBaseStrength + accumulatedTraining);

                    units.splice(index, 1); // Remove the old unit.
                    units.push(newUnit); // Add the new unit.
                    console.log(`Army ${armyName}: Transformed a ${originalUnit.type} into a ${newUnit.type}. Gold: ${gold}, New Unit Strength: ${newUnit.getStrength()}`);
                    return true;
                } else {
                    console.error(`Army ${armyName}: Unit not found for transformation.`);
                    addGold(cost); // Refund gold if unit wasn't found (shouldn't happen with proper unit selection).
                    return false;
                }
            }
            return false; // Should not happen if gold check passes.
        },

        /**
         * Simulates a battle between this army and another.
         * @param {object} otherArmy - The opposing army.
         * @returns {string} The battle outcome: "win", "loss", or "tie".
         */
        attack: (otherArmy) => {
            const myStrength = getTotalStrength(); // Call getTotalStrength directly
            const opponentStrength = otherArmy.getTotalStrength(); // This is fine as it's a method on `otherArmy` object

            let battleResult;
            let myUnitsLost = 0;
            let opponentUnitsLost = 0;

            if (myStrength > opponentStrength) {
                battleResult = "win";
                addGold(100);
                otherArmy.loseUnits(2); // Loser loses two strongest units.
                opponentUnitsLost = 2;
                console.log(`${armyName} WINS! Gains 100 gold. ${otherArmy.armyName} loses 2 units.`);
            } else if (opponentStrength > myStrength) {
                battleResult = "loss";
                otherArmy.addGold(100);
                loseUnits(2); // Changed from this.loseUnits to direct call (though this was already okay as `loseUnits` is a const)
                myUnitsLost = 2;
                console.log(`${otherArmy.armyName} WINS! Gains 100 gold. ${armyName} loses 2 units.`);
            } else {
                battleResult = "tie";
                loseUnits(1); // Programmer's discretion: both lose one unit on a tie.
                otherArmy.loseUnits(1);
                myUnitsLost = 1;
                opponentUnitsLost = 1;
                console.log(`It's a TIE! Both armies lose 1 unit.`);
            }

            // Record battle outcome for both armies' histories.
            battleHistory.push({
                opponent: otherArmy.armyName,
                result: battleResult,
                date: new Date().toISOString(),
                myStrength: myStrength,
                opponentStrength: opponentStrength,
                unitsLost: myUnitsLost
            });

            otherArmy.getBattleHistory().push({
                opponent: armyName,
                result: battleResult === "win" ? "loss" : (battleResult === "loss" ? "win" : "tie"),
                date: new Date().toISOString(),
                myStrength: opponentStrength,
                opponentStrength: myStrength,
                unitsLost: opponentUnitsLost
            });

            console.log(`After battle: ${armyName} Units: ${units.length}, Gold: ${gold}. ${otherArmy.armyName} Units: ${otherArmy.getUnits().length}, Gold: ${otherArmy.getGold()}.`); // Use `units.length` and `gold` directly
            return battleResult;
        },
        // Expose loseUnits as a callable method for battle consequences.
        loseUnits: loseUnits
    };
};



// --- Simulation Starts Here ---
console.log("--- Preparing Armies ---");

// Create two armies for each civilization, as requested.
const chineseArmyAlpha = createArmy("Chinos", "The Iron Lotus");
const chineseArmyBeta = createArmy("Chinos", "Jade Emperor's Guard");

const englishArmyAlpha = createArmy("Ingleses", "Saxon Shieldwall");
const englishArmyBeta = createArmy("Ingleses", "Norman Conquerors");

const bizantineArmyAlpha = createArmy("Bizantinos", "Basilisk Sentinels");
const bizantineArmyBeta = createArmy("Bizantinos", "Golden Gate Defenders");


// Group all armies for easier iteration.
const allArmies = [
  chineseArmyAlpha, chineseArmyBeta,
  englishArmyAlpha, englishArmyBeta,
  bizantineArmyAlpha, bizantineArmyBeta
];


// --- Copy and Paste simulation HERE :) ---

chineseArmyAlpha.trainUnit(chineseArmyAlpha.getUnits().filter(unit => unit.type === "Pikeman")[2])