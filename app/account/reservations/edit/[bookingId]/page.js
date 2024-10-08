import SubmitButton from '@/app/_components/SubmitButton';
import { updateReservation } from '@/app/_lib/actions';
import { getBooking, getCabin } from '@/app/_lib/data-service';

export async function generateMetadata({ params }) {
  return {
    title: `Edit Reservation ${params.bookingId}`,
  };
}

export default async function Page({ params }) {
  const { bookingId } = params;
  const { numGuests, observations, cabinId, hasBreakfast } =
    await getBooking(bookingId);
  const { maxCapacity } = await getCabin(cabinId);

  return (
    <div>
      <h2 className="mb-7 text-2xl font-semibold text-accent-400">
        Edit Reservation #{bookingId}
      </h2>

      <form
        action={updateReservation}
        className="flex flex-col gap-6 bg-primary-900 px-12 py-8 text-lg"
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <div className="space-y-2">
          <label htmlFor="numGuests">How many guests?</label>
          <select
            name="numGuests"
            id="numGuests"
            className="w-full rounded-sm bg-primary-200 px-5 py-3 text-primary-800 shadow-sm"
            required
            defaultValue={numGuests}
          >
            <option value="" key="">
              Select number of guests...
            </option>
            {Array.from({ length: maxCapacity }, (_, i) => i + 1).map(x => (
              <option value={x} key={x}>
                {x} {x === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="observations">
            Anything we should know about your stay?
          </label>
          <textarea
            name="observations"
            defaultValue={observations}
            className="w-full rounded-sm bg-primary-200 px-5 py-3 text-primary-800 shadow-sm"
          />
        </div>
        <div className="flex items-center justify-start gap-5">
          <label htmlFor="hasBreakfast">Want to have breakfast?</label>
          <input
            name="hasBreakfast"
            type="checkbox"
            value="hasBreakfast"
            defaultChecked={hasBreakfast}
            className="h-5 w-5 rounded border-gray-300"
          />
        </div>

        <div className="flex items-center justify-end gap-6">
          <SubmitButton pendingLabel="Updating...">
            Update reservation
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
