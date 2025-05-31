import { storeClicks } from "@/db/apiClicks";
import { getLongUrl } from "@/db/apiUrls";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";

const RedirectLink = () => {
  const { id } = useParams();
  const { loading, data, fn } = useFetch(getLongUrl, id);

  useEffect(() => {
    const recordClickAndRedirect = async () => {
      try {
        await fn();
        if (data && data.original_url) {
          await storeClicks({ id: data.id, originalUrl: data.original_url });
          window.location.replace(data.original_url);
        }
      } catch (error) {
        console.error("Error during redirect:", error);
      }
    };

    recordClickAndRedirect();
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <BarLoader width={"200px"} color="#36d7b7" />
        <p className="mt-4">Redirecting to the original URL...</p>
      </div>
    );
  }

  if (!data || !data.original_url) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">URL not found or invalid.</p>
      </div>
    );
  }

  return null;
};

export default RedirectLink;