import useSWRMutation from "swr/mutation";

export async function requestUploadFile(
  url: string,
  { file }: { file: File }
): Promise<{ url: string }> {
  const myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    "Bearer mxa1b7695b97e29314bcf4821b28f3511c"
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
    }
  );
}
