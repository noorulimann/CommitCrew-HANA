'use client';

import { RumorSubmitForm } from '@/components/rumors';

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Submit a Rumor
      </h1>
      
      <RumorSubmitForm />
    </div>
  );
}
