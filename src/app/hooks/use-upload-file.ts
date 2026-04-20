import useSWRMutation from "swr/mutation";

export async function requestUploadFile(
  url: string,
  { file }: { file: File },
): Promise<{ url: string }> {
  const myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    "Bearer mxa1b7695b97e29314bcf4821b28f3511c",
  );

  const formdata = new FormData();
  formdata.append("file", file);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: formdata,
    // redirect: "follow" as RequestRedirect,
  };

  const raw = await fetch(url, requestOptions);

  const text = await raw.text();

  return JSON.parse(text);
}

export function useUploadFile() {
  return useSWRMutation<{ url: string }, unknown, string, { file: File }>(
    "https://sv-k8.l192.com/upload/chuck",
    (url, arg) => {
      return requestUploadFile(url, { file: arg.arg.file });
    },
  );
}

export function requestUploadFileMinIO(
  url: string,
  { arg: { file } }: { arg: { file: File } },
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64data = reader.result?.toString().split(",")[1];

      if (!base64data) {
        reject(new Error("Failed to read file as base64"));
        return;
      }

      const uniqueId = new Date().getTime();
      const extension = file.name.split(".").pop();
      const newFileName = `${uniqueId}.${extension}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: newFileName,
          fileContent: base64data,
        }),
      });

      const data = await res.json();
      resolve(data);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useUploadFileMinIO() {
  return useSWRMutation<{ url: string }, unknown, string, { file: File }>(
    "/api/upload",
    requestUploadFileMinIO,
  );
}
