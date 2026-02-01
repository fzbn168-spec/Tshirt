'use client';

import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { sendEmail, ContactFormData } from '@/lib/actions';

type FormData = ContactFormData;

export default function ContactPage() {
  const t = useTranslations('Contact');
  const searchParams = useSearchParams();
  const productInquiry = searchParams.get('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    if (productInquiry) {
      setValue('message', `I am interested in: ${productInquiry}. Please send me more information.`);
    }
  }, [productInquiry, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const result = await sendEmail(data);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(result.error || 'Something went wrong');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{t('title')}</h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
            {/* Contact Info */}
            <div className="flex flex-col gap-10">
                <div className="flex gap-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">{t('info.address')}</h3>
                        <p className="mt-2 leading-7 text-gray-600">
                            {t('info.address')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <Phone className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">{t('phone')}</h3>
                        <p className="mt-2 leading-7 text-gray-600">{t('info.phone')}</p>
                    </div>
                </div>
                <div className="flex gap-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <Mail className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900">{t('email')}</h3>
                        <p className="mt-2 leading-7 text-gray-600">{t('info.email')}</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <h3 className="text-xl font-semibold text-gray-900">{t('formTitle')}</h3>
                {isSuccess ? (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">{t('success')}</h3>
                            </div>
                        </div>
                    </div>
                ) : (
                  <>
                    {errorMessage && (
                        <div className="rounded-md bg-red-50 p-4 mb-6">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold leading-6 text-gray-900">
                                {t('name')}
                            </label>
                            <div className="mt-2.5">
                                <input
                                    {...register('name', { required: true })}
                                    type="text"
                                    id="name"
                                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                                {errors.name && <span className="text-red-500 text-sm">Required</span>}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                                {t('email')}
                            </label>
                            <div className="mt-2.5">
                                <input
                                    {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                                    type="email"
                                    id="email"
                                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                                {errors.email && <span className="text-red-500 text-sm">Valid email required</span>}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="company" className="block text-sm font-semibold leading-6 text-gray-900">
                                {t('company')}
                            </label>
                            <div className="mt-2.5">
                                <input
                                    {...register('company')}
                                    type="text"
                                    id="company"
                                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                         <div className="sm:col-span-2">
                            <label htmlFor="phone" className="block text-sm font-semibold leading-6 text-gray-900">
                                {t('phone')}
                            </label>
                            <div className="mt-2.5">
                                <input
                                    {...register('phone')}
                                    type="tel"
                                    id="phone"
                                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                                {t('message')}
                            </label>
                            <div className="mt-2.5">
                                <textarea
                                    {...register('message', { required: true })}
                                    id="message"
                                    rows={4}
                                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                                {errors.message && <span className="text-red-500 text-sm">Required</span>}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> {t('submitting')}
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> {t('submit')}
                                </>
                            )}
                        </button>
                    </div>
                  </>
                )}
            </form>
        </div>
      </div>
    </div>
  );
}
