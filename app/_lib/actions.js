'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from './auth';

import { supabase } from './supabase';
import { isWithinInterval } from 'date-fns';
import { getBookedDatesByCabinId, getBookings } from './data-service';

export async function UpdateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error('Please provide a valid national ID');

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from('guests')
    .update(updateData)
    .eq('id', session.user.guestId);

  if (error) throw new Error('Guest could not be updated');

  revalidatePath('/account/profile');
}

export async function createReservation(reservationData, formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const { cabinId, startDate, endDate } = reservationData;
  const bookedDates = await getBookedDatesByCabinId(cabinId);

  if (
    startDate &&
    endDate &&
    bookedDates.some(date =>
      isWithinInterval(date, { start: startDate, end: endDate }),
    )
  )
    throw new Error('This dates already been reserved, Please select another');

  // Object.entries(formData.entries())

  const newBooking = {
    ...reservationData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    extrasPrice: 0,
    totalPrice: reservationData.cabinPrice,
    isPaid: false,
    hasBreakfast:
      formData.get('hasBreakfast') === 'hasBreakfast' ? true : false,
    status: 'unconfirmed',
  };

  const { error } = await supabase.from('bookings').insert([newBooking]);

  if (error) throw new Error('Booking could not be created');

  revalidatePath(`cabins/${cabinId}`);

  redirect('/cabins/thankyou');
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map(booking => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to delete this reservation');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be deleted');

  revalidatePath('/account/reservations');
}

export async function updateReservation(formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map(booking => booking.id);

  const bookingId = Number(formData.get('bookingId'));
  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to edit this reservation');

  const updateData = {
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    hasBreakfast:
      formData.get('hasBreakfast') === 'hasBreakfast' ? true : false,
  };
  console.log(updateData);

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId);

  if (error) throw new Error('Booking could not be updated');

  revalidatePath('/account/reservations');
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  redirect('/account/reservations');
}

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
