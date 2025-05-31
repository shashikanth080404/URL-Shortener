import {storeClicks} from "@/db/apiClicks";
import {getLongUrl} from "@/db/apiUrls";
import useFetch from "@/hooks/use-fetch";
import {useEffect} from "react";
import {useParams} from "react-router-dom";
import {BarLoader} from "react-spinners";

const RedirectLink = () => {
  const {id} = useParams();

  const {loading, data, fn} = useFetch(getLongUrl, {id});

  useEffect(() => {
    const recordClickAndRedirect = async () => {
      await fn();
      if (data && data.original_url) {
        await storeClicks({id: data.id, originalUrl: data.original_url});
        // Redirect after recording click
        window.location.href = data.original_url;
      }
    };
    recordClickAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <>
        <BarLoader width={"100%"} color="#36d7b7" />
        <br />
        Loading original content...
      </>
    );
  }

  if (!data || !data.original_url) {
    return <div>Original URL not found.</div>;
  }

  return null; // No iframe rendering, redirect handled above
};

export default RedirectLink;
