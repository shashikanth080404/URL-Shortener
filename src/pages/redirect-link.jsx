import { storeClicks } from "@/db/apiClicks";
import { getLongUrl } from "@/db/apiUrls";
import useFetch from "@/hooks/use-fetch";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";

const RedirectLink = () => {
  const { id } = useParams();
  const { loading, error, data, fn } = useFetch(getLongUrl, id);

  useEffect(() => {
    fn();
  }, []);

  useEffect(() => {
    const handleRedirect = async () => {
      if (data?.id && data?.original_url) {
        try {
          await storeClicks({ id: data.id, originalUrl: data.original_url });
          window.location.href = data.original_url;
        } catch (err) {
          console.error("Error storing clicks:", err);
          // Still redirect even if click tracking fails
          window.location.href = data.original_url;
        }
      }
    };

    if (data) {
      handleRedirect();
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <BarLoader width={"200px"} color="#36d7b7" />
        <p className="mt-4">Redirecting to the original URL...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-400">
          {error?.message || "URL not found or invalid."}
        </p>
      </div>
    );
  }

  return null;
};

export default RedirectLink;