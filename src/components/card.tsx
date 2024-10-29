import { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

export const Card = (props: PropsWithChildren<CardProps>) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${props.className}`}
    >
      {props.children}
    </div>
  );
};

export const CardHeader = (props: PropsWithChildren<CardProps>) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${props.className}`}>
      {props.children}
    </div>
  );
};

export const CardTitle = (props: PropsWithChildren<CardProps>) => {
  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${props.className}`}
    >
      {props.children}
    </h3>
  );
};

export const CardContent = (props: PropsWithChildren<CardProps>) => {
  return <div className={`p-6 pt-0 ${props.className}`}>{props.children}</div>;
};
