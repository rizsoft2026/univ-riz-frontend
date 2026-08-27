import ArabianFlag from '@/assets/images/flags/arebian.svg';
import FrenchFlag from '@/assets/images/flags/french.jpg';
import GermanyFlag from '@/assets/images/flags/germany.jpg';
import ItalyFlag from '@/assets/images/flags/italy.jpg';
import JapaneseFlag from '@/assets/images/flags/japanese.svg';
import RussiaFlag from '@/assets/images/flags/russia.jpg';
import SpainFlag from '@/assets/images/flags/spain.jpg';
import UsFlag from '@/assets/images/flags/us.jpg';
import avatar1 from '@/assets/images/user/avatar-1.png';
import avatar3 from '@/assets/images/user/avatar-3.png';
import avatar5 from '@/assets/images/user/avatar-5.png';
import avatar7 from '@/assets/images/user/avatar-7.png';
import { Link } from 'react-router';
import { TbSearch } from 'react-icons/tb';
import SimpleBar from 'simplebar-react';
import SidenavToggle from './SidenavToggle';
import ThemeModeToggle from './ThemeModeToggle';
import { LuBellRing, LuClock, LuGem, LuHeart, LuLogOut, LuMail, LuMessagesSquare, LuMoveRight, LuSettings, LuShoppingBag } from 'react-icons/lu';
const languages = [{
  src: UsFlag,
  label: 'English'
}, {
  src: SpainFlag,
  label: 'Spanish'
}, {
  src: GermanyFlag,
  label: 'German'
}, {
  src: FrenchFlag,
  label: 'French'
}, {
  src: JapaneseFlag,
  label: 'Japanese'
}, {
  src: ItalyFlag,
  label: 'Italian'
}, {
  src: RussiaFlag,
  label: 'Russian'
}, {
  src: ArabianFlag,
  label: 'Arabic'
}];
const tabs = [{
  id: 'tabsViewall',
  title: 'View all',
  active: true
}, {
  id: 'tabsMentions',
  title: 'Mentions'
}, {
  id: 'tabsFollowers',
  title: 'Followers'
}, {
  id: 'tabsInvites',
  title: 'Invites'
}];
const notifications = {
  tabsViewall: [{
    type: 'follow',
    avatar: avatar3,
    text: <>
      <b>@willie_passem</b> followed you
    </>,
    time: 'Wednesday 03:42 PM',
    ago: '4 sec'
  }, {
    type: 'comment',
    avatar: avatar5,
    text: <>
      <b>@caroline_jessica</b> commented <br />
      on your post
    </>,
    time: 'Wednesday 03:42 PM',
    ago: '15 min',
    comment: 'Amazing! Fast, to the point, professional and really amazing to work with them!!!'
  }, {
    type: 'purchase',
    icon: <LuShoppingBag className="size-5 text-danger" />,
    text: <>
      Successfully purchased a business plan for <span className="text-danger">$199.99</span>
    </>,
    time: 'Monday 11:26 AM',
    ago: 'yesterday'
  }, {
    type: 'like',
    avatar: avatar7,
    icon: <LuHeart className="size-3.5 fill-orange-500" />,
    text: <>
      <b>@scott</b> liked your post
    </>,
    time: 'Thursday 06:59 AM',
    ago: '1 Week'
  }],
  tabsMentions: [{
    type: 'comment',
    avatar: avatar5,
    text: <>
      <b>@caroline_jessica</b> commented <br />
      on your post
    </>,
    time: 'Wednesday 03:42 PM',
    ago: '15 min',
    comment: 'Amazing! Fast, to the point, professional and really amazing to work with them!!!'
  }, {
    type: 'like',
    avatar: avatar7,
    icon: <LuHeart className="size-3.5 fill-orange-500" />,
    text: <>
      <b>@scott</b> liked your post
    </>,
    time: 'Thursday 06:59 AM',
    ago: '1 Week'
  }],
  tabsFollowers: [{
    type: 'follow',
    avatar: avatar3,
    text: <>
      <b>@willie_passem</b> followed you
    </>,
    time: 'Wednesday 03:42 PM',
    ago: '4 sec'
  }],
  tabsInvites: [{
    type: 'purchase',
    icon: <LuShoppingBag className="size-5 text-danger" />,
    text: <>
      Successfully purchased a business plan for <span className="text-danger">$199.99</span>
    </>,
    time: 'Monday 11:26 AM',
    ago: 'yesterday'
  }]
};
const profileMenu = [{
  icon: <LuMail className="size-4" />,
  label: 'Inbox',
  to: '/mailbox',
  badge: '15'
}, {
  icon: <LuMessagesSquare className="size-4" />,
  label: 'Chat',
  to: '/chat'
}, {
  icon: <LuGem className="size-4" />,
  label: 'Upgrade Pro',
  to: '/pricing'
}, {
  divider: true
}, {
  icon: <LuLogOut className="size-4" />,
  label: 'Sign Out',
  to: '/basic-logout'
}];
const Topbar = () => {
  return <div className="app-header min-h-topbar-height flex items-center sticky top-0 z-30 bg-(--topbar-background) border-b border-default-200">
    <div className="w-full flex items-center justify-between px-6">
      <div className="flex items-center gap-5">
        <SidenavToggle />

      </div>

      <div className="flex items-center gap-3">
        <ThemeModeToggle />

        <div className="topbar-item hs-dropdown relative inline-flex">

          <div className="hs-dropdown-menu min-w-48">
            <div className="p-2">
              <h6 className="mb-2 text-default-500">Welcome to Tailwick</h6>
              <Link to="#!" className="flex gap-3">
                <div className="relative inline-block">
                  <img src={avatar1} alt="user" className="size-12 rounded" />
                  <span className="-top-1 -end-1 absolute w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h6 className="mb-1 text-sm font-semibold text-default-800">Paula Keenan</h6>
                  <p className="text-default-500">CEO & Founder</p>
                </div>
              </Link>
            </div>

            <div className="border-t border-default-200 -mx-2 my-2"></div>

            <div className="flex flex-col gap-y-1">
              {profileMenu.map((item, i) => item.divider ? <div key={i} className="border-t border-default-200 -mx-2 my-1"></div> : <Link key={i} to={item.to || '#!'} className="flex items-center gap-x-3.5 py-1.5 px-3 text-default-600 hover:bg-default-150 rounded font-medium">
                {item.icon}
                {item.label}
                {item.badge && <span className="size-4.5 font-semibold bg-danger rounded text-white flex items-center justify-center text-xs">
                  {item.badge}
                </span>}
              </Link>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
export default Topbar;