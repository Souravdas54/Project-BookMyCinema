export const generateNext7Days = (): Date[] => {
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        dates.push(d);
    }

    return dates;
};
