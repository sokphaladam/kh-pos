export {};

declare global {
  interface Window {
    showDialog: Record<
      string,
      (props: {
        component: FunctionComponent;
        options: unknown;
        resolve: (props: unknown) => void;
        defaultCloseValue: unknown;
        className?: string;
      }) => void
    >;
    showSheet: Record<
    string,
    (props: {
      component: FunctionComponent;
      options: unknown;
      resolve: (props: unknown) => void;
      defaultCloseValue: unknown;
    }) => void
  >;
  }
}
