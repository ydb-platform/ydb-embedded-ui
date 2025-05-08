export function downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const createAndDownloadStringifiedJsonFile = (data: string, fileName: string) => {
    const blob = new Blob([data], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${fileName}.json`);
    URL.revokeObjectURL(url);
};

export const createAndDownloadJsonFile = (data: unknown, fileName: string) => {
    const preparedData = JSON.stringify(data, null, 2);
    createAndDownloadStringifiedJsonFile(preparedData, fileName);
};
