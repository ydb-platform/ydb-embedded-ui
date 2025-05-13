export function downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const createAndDownloadFile = (data: string, fileName: string, type?: string) => {
    const blob = new Blob([data], {
        type,
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, fileName);
    URL.revokeObjectURL(url);
};

export const createAndDownloadJsonFile = (data: unknown, fileName: string) => {
    const preparedData = JSON.stringify(data, null, 2);
    createAndDownloadFile(preparedData, `${fileName}.json`, 'application/json');
};
