export default async function Page() {
  await new Promise((resolve) => setTimeout(resolve, 5_000));

  return <div>works</div>;
}
