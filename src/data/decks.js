import { v4 as uuidv4 } from 'uuid';

export const CARD_TYPES = {
    NUMBER: 'n',
    WORD: 'w',
};

const createCard = (type, value, count, label = value) => {
    return Array(count).fill(null).map(() => ({
        id: uuidv4(),
        type,
        value,
        label,
        points: 1,
    }));
};

export const generateNDeck = () => {
    const deck = [
        ...createCard(CARD_TYPES.NUMBER, '100%', 10, '100'),
        ...createCard(CARD_TYPES.NUMBER, '0%', 8, '0'),
        ...createCard(CARD_TYPES.NUMBER, '1%', 6, '1'),
        ...createCard(CARD_TYPES.NUMBER, '2%', 6, '2'),
        ...createCard(CARD_TYPES.NUMBER, '3%', 2, '3'),
        ...createCard(CARD_TYPES.NUMBER, '4%', 2, '4'),
        ...createCard(CARD_TYPES.NUMBER, '5%', 2, '5'),
        ...createCard(CARD_TYPES.NUMBER, '6%', 2, '6'),
        ...createCard(CARD_TYPES.NUMBER, '7%', 2, '7'),
        ...createCard(CARD_TYPES.NUMBER, '8%', 2, '8'),
        ...createCard(CARD_TYPES.NUMBER, '9%', 2, '9'),
        ...createCard(CARD_TYPES.NUMBER, 'Wild', 2, 'Wild'),
    ];
    return shuffle(deck);
};

export const generateWDeck = () => {
    const deck = [
        ...createCard(CARD_TYPES.WORD, '全部', 10),
        ...createCard(CARD_TYPES.WORD, '佔/是', 10), // Handling '佔' or '是' as one card type? Prompt says "佔/是". I'll use the combined string for now.
        ...createCard(CARD_TYPES.WORD, '的', 10),
        ...createCard(CARD_TYPES.WORD, '/', 9),
        ...createCard(CARD_TYPES.WORD, 'x 100%', 9),
        ...createCard(CARD_TYPES.WORD, '百分之幾?', 6),
        ...createCard(CARD_TYPES.WORD, 'red', 5, '紅色'),
        ...createCard(CARD_TYPES.WORD, 'yellow', 5, '黃色'),
        ...createCard(CARD_TYPES.WORD, 'blue', 5, '藍色'),
        ...createCard(CARD_TYPES.WORD, '+', 5),
        ...createCard(CARD_TYPES.WORD, 'Wild', 2),
    ];
    return shuffle(deck);
};

// Fisher-Yates Shuffle
const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};
