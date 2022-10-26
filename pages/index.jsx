import {getSession} from "next-auth/react";

function HomePage() {
  return (
      <div>
        This is the index
      </div>
  );
}

export const getServerSideProps = async (context) => {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        }
    } else {
        return {
            redirect: {
                destination: '/portfolio',
                permanent: false,
            },
        }
    }
}

export default HomePage;