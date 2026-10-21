'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProfileCollection.module.css';

type Props = {
  base: string;
  types: { value: string; label: string }[];
  years: number[];
  selectedType: string;
  selectedYear: string;
};

export default function PublicationFilters({ base, types, years, selectedType, selectedYear }: Props) {
  const router = useRouter();
  const [type, setType] = useState(selectedType);
  const [year, setYear] = useState(selectedYear);

  function apply(nextType: string, nextYear: string) {
    const query = new URLSearchParams();
    if (nextType) query.set('type', nextType);
    if (nextYear) query.set('year', nextYear);
    router.replace(`${base}${query.size ? `?${query}` : ''}`, { scroll: false });
  }

  return (
    <div className={styles.filters} aria-label="Filter publications">
      <label>
        Publication type
        <select value={type} onChange={(event) => {
          const nextType = event.target.value;
          setType(nextType);
          apply(nextType, year);
        }}>
          <option value="">All types</option>
          {types.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Year
        <select value={year} onChange={(event) => {
          const nextYear = event.target.value;
          setYear(nextYear);
          apply(type, nextYear);
        }}>
          <option value="">All years</option>
          {years.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
  );
}
