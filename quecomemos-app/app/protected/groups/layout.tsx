import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grupos | QueComemos',
  description: 'Gestiona tus grupos de comidas y colabora con otros usuarios',
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}